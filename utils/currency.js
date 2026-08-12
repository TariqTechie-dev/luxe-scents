const CURRENCY_CODE = 'PKR';
const CURRENCY_LABEL = 'Rs.';
const CURRENCY_LOCALE = 'en-PK';

const formatCurrency = (value, options = {}) => {
    const numericValue = Number(value);
    const amount = Number.isFinite(numericValue) ? numericValue : 0;
    const hasFraction = !Number.isInteger(amount);

    const minimumFractionDigits = options.minimumFractionDigits ?? (hasFraction ? 2 : 0);
    const maximumFractionDigits = options.maximumFractionDigits ?? 2;

    return `${CURRENCY_LABEL} ${amount.toLocaleString(CURRENCY_LOCALE, {
        minimumFractionDigits,
        maximumFractionDigits
    })}`;
};

module.exports = {
    CURRENCY_CODE,
    CURRENCY_LABEL,
    CURRENCY_LOCALE,
    formatCurrency
};
