/**
 * 格式化數字，添加千位分隔符
 * @param {number} num - 要格式化的數字
 * @returns {string} - 格式化後的字符串
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}
