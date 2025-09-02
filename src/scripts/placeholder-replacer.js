// Optimized placeholder replacement script
const BEGINNER_TABLE_HTML = `
<div class="broker-table-wrapper">
  <table class="broker-table">
    <thead>
      <tr class="table-header">
        <th class="header-cell company-header">الشركة</th>
        <th class="header-cell deposit-header">أقل مبلغ للإيداع</th>
        <th class="header-cell rating-header">التقييم</th>
      </tr>
    </thead>
    
    <tbody>
      <tr class="broker-row">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: #1e40af">
              <span class="logo-text">Evest</span>
            </div>
            <span class="company-name">Evest</span>
          </div>
        </td>
        <td class="broker-cell deposit-cell">
          <span class="deposit-amount">50</span>
        </td>
        <td class="broker-cell rating-cell">
          <span class="rating-value">4.5/5</span>
        </td>
      </tr>

      <tr class="broker-row">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: #4f46e5">
              <span class="logo-text">AvaTrade</span>
            </div>
            <span class="company-name">AvaTrade</span>
          </div>
        </td>
        <td class="broker-cell deposit-cell">
          <span class="deposit-amount">100</span>
        </td>
        <td class="broker-cell rating-cell">
          <span class="rating-value">4/5</span>
        </td>
      </tr>

      <tr class="broker-row">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: #dc2626">
              <span class="logo-text">XTB</span>
            </div>
            <span class="company-name">XTB</span>
          </div>
        </td>
        <td class="broker-cell deposit-cell">
          <span class="deposit-amount">100</span>
        </td>
        <td class="broker-cell rating-cell">
          <span class="rating-value">4/5</span>
        </td>
      </tr>

      <tr class="broker-row">
        <td class="broker-cell company-cell">
          <div class="company-info">
            <div class="company-logo" style="background: #fbbf24; color: #1f2937">
              <span class="logo-text">Exness</span>
            </div>
            <span class="company-name">Exness</span>
          </div>
        </td>
        <td class="broker-cell deposit-cell">
          <span class="deposit-amount">10</span>
        </td>
        <td class="broker-cell rating-cell">
          <span class="rating-value">4.5/5</span>
        </td>
      </tr>
    </tbody>

    <tfoot>
      <tr>
        <td colspan="3" class="table-footer">
          <div class="footer-content">
            <span class="footer-icon">⚡</span>
            <span class="footer-text">أفضل شركات التداول للمبتدئين</span>
          </div>
        </td>
      </tr>
    </tfoot>
  </table>
</div>
`;

// Optimized single-pass placeholder replacement
function replacePlaceholders() {
  const contentBody = document.querySelector('.content-body');
  if (!contentBody) return;

  const content = contentBody.innerHTML;
  
  // Only process if placeholder exists
  if (content.includes('[beginner-57]')) {
    contentBody.innerHTML = content.replace(/\[beginner-57\]/g, BEGINNER_TABLE_HTML);
  }
}

// Run once when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', replacePlaceholders);
} else {
  replacePlaceholders();
}
