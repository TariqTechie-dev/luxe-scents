const User = require('../models/User');
const Order = require('../models/Order');
const mongoose = require('mongoose');

const CUSTOMER_SEGMENTS = {
  vip: 'VIP',
  repeat: 'Repeat',
  new: 'New',
  inactive: 'Inactive',
  'no-orders': 'No Orders',
  standard: 'Standard'
};

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  name_asc: { name: 1 },
  most_orders: { totalOrders: -1, lastOrderAt: -1, createdAt: -1 },
  highest_spend: { totalSpent: -1, totalOrders: -1, createdAt: -1 },
  last_order: { lastOrderAt: -1, createdAt: -1 }
};

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const normalizeQueryValue = (value) => {
  return typeof value === 'string' ? value.trim() : '';
};

const buildCustomerPipeline = ({ q = '', segment = '', sort = 'newest' } = {}) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const inactiveCutoff = new Date(now);
  inactiveCutoff.setDate(inactiveCutoff.getDate() - 180);

  const matchStage = { role: 'customer' };

  if (q) {
    const searchRegex = new RegExp(escapeRegex(q), 'i');
    matchStage.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  const pipeline = [
    { $match: matchStage },
    {
      $lookup: {
        from: 'orders',
        let: { userId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$userId'] } } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: {
                $sum: {
                  $cond: [
                    { $ne: ['$status', 'Cancelled'] },
                    { $ifNull: ['$totalAmount', 0] },
                    0
                  ]
                }
              },
              lastOrderAt: { $max: '$createdAt' }
            }
          }
        ],
        as: 'orderStats'
      }
    },
    {
      $addFields: {
        totalOrders: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalOrders', 0] }, 0] },
        totalSpent: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalSpent', 0] }, 0] },
        lastOrderAt: { $arrayElemAt: ['$orderStats.lastOrderAt', 0] },
        isNewCustomer: { $gte: ['$createdAt', thirtyDaysAgo] }
      }
    },
    {
      $addFields: {
        segment: {
          $switch: {
            branches: [
              { case: { $or: [{ $gte: ['$totalOrders', 5] }, { $gte: ['$totalSpent', 500] }] }, then: 'VIP' },
              { case: { $and: [{ $gt: ['$totalOrders', 0] }, { $lt: ['$lastOrderAt', inactiveCutoff] }] }, then: 'Inactive' },
              { case: { $gte: ['$totalOrders', 2] }, then: 'Repeat' },
              { case: '$isNewCustomer', then: 'New' },
              { case: { $eq: ['$totalOrders', 0] }, then: 'No Orders' }
            ],
            default: 'Standard'
          }
        }
      }
    }
  ];

  if (segment && CUSTOMER_SEGMENTS[segment]) {
    pipeline.push({ $match: { segment: CUSTOMER_SEGMENTS[segment] } });
  }

  pipeline.push(
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        phone: 1,
        'address.city': 1,
        'address.country': 1,
        createdAt: 1,
        totalOrders: 1,
        totalSpent: 1,
        lastOrderAt: 1,
        segment: 1
      }
    },
    { $sort: SORT_OPTIONS[sort] || SORT_OPTIONS.newest }
  );

  return pipeline;
};

const buildCustomerStats = (customers) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalCustomers = customers.length;
  const totalCustomerValue = customers.reduce((sum, customer) => sum + Number(customer.totalSpent || 0), 0);

  return {
    totalCustomers,
    newThisMonth: customers.filter((customer) => new Date(customer.createdAt) >= startOfMonth).length,
    repeatCustomers: customers.filter((customer) => Number(customer.totalOrders || 0) >= 2).length,
    vipCustomers: customers.filter((customer) => customer.segment === 'VIP').length,
    averageCustomerValue: totalCustomers ? totalCustomerValue / totalCustomers : 0
  };
};

const escapeCsvValue = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const buildCustomerCsv = (customers) => {
  const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Location', 'Orders', 'Lifetime Spend', 'Last Order', 'Segment', 'Joined'];
  const rows = customers.map((customer) => {
    const location = [customer.address?.city, customer.address?.country].filter(Boolean).join(', ');
    const lastOrder = customer.lastOrderAt ? new Date(customer.lastOrderAt).toISOString().slice(0, 10) : '';
    const joined = customer.createdAt ? new Date(customer.createdAt).toISOString().slice(0, 10) : '';

    return [
      customer._id,
      customer.name,
      customer.email,
      customer.phone,
      location,
      customer.totalOrders,
      Number(customer.totalSpent || 0).toFixed(2),
      lastOrder,
      customer.segment,
      joined
    ].map(escapeCsvValue).join(',');
  });

  return [headers.map(escapeCsvValue).join(','), ...rows].join('\n');
};

// GET /admin/customers - List all customers with value and engagement metrics.
exports.getCustomers = async (req, res, next) => {
  try {
    const q = normalizeQueryValue(req.query.q);
    const requestedSegment = normalizeQueryValue(req.query.segment);
    const requestedSort = normalizeQueryValue(req.query.sort);
    const segment = CUSTOMER_SEGMENTS[requestedSegment] ? requestedSegment : '';
    const sort = SORT_OPTIONS[requestedSort] ? requestedSort : 'newest';

    const [allCustomers, customers] = await Promise.all([
      User.aggregate(buildCustomerPipeline()),
      User.aggregate(buildCustomerPipeline({ q, segment, sort }))
    ]);

    if (req.query.export === 'csv') {
      res.header('Content-Type', 'text/csv; charset=utf-8');
      res.attachment('luxe-scents-customers.csv');
      return res.send(buildCustomerCsv(customers));
    }

    return res.render('admin/customers', {
      title: 'Customer Directory',
      customers,
      stats: buildCustomerStats(allCustomers),
      filters: { q, segment, sort },
      path: '/admin/customers'
    });
  } catch (error) {
    return next(error);
  }
};

// GET /admin/customers/:id - Customer details + orders.
exports.getCustomerDetail = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      req.flash('error', 'Invalid customer ID');
      return res.redirect('/admin/customers');
    }

    const customer = await User.findOne({
      _id: req.params.id,
      role: 'customer'
    }).lean();

    if (!customer) {
      req.flash('error', 'Customer not found');
      return res.redirect('/admin/customers');
    }

    const orders = await Order.find({ user: customer._id })
      .populate('items.product', 'name imageUrl')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.render('admin/customer_details', {
      title: `Customer: ${customer.name}`,
      customer,
      orders,
      path: '/admin/customers'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = exports;
