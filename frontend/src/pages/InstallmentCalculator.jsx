import React, { useState, useMemo } from 'react';
import './InstallmentCalculator.css';

function InstallmentCalculator() {
  const [propertyValue, setPropertyValue] = useState(15000000);
  const [downPaymentAmount, setDownPaymentAmount] = useState(3000000);
  const [loanTermYears, setLoanTermYears] = useState(5);
  const [interestRate, setInterestRate] = useState(12);
  const [showSchedule, setShowSchedule] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculations = useMemo(() => {
    const validDownPaymentAmount = Math.min(downPaymentAmount, propertyValue);
    const principalAmount = propertyValue - validDownPaymentAmount;

    const r = (interestRate / 100) / 12;
    const n = loanTermYears * 12;

    let monthlyPayment = 0;
    if (r > 0) {
      monthlyPayment = (principalAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyPayment = principalAmount / n;
    }

    const totalPayment = (monthlyPayment * n) + validDownPaymentAmount;
    const totalInterest = (monthlyPayment * n) - principalAmount;

    let schedule = [];
    if (showSchedule) {
      let balance = principalAmount;
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;

      for (let month = 1; month <= n; month++) {
        const interestForMonth = balance * r;
        const principalForMonth = monthlyPayment - interestForMonth;

        yearlyInterest += interestForMonth;
        yearlyPrincipal += principalForMonth;
        balance -= principalForMonth;

        if (month % 12 === 0 || month === n) {
          schedule.push({
            year: Math.ceil(month / 12),
            interest: yearlyInterest,
            principal: yearlyPrincipal,
            balance: Math.max(0, balance),
            payment: yearlyInterest + yearlyPrincipal
          });
          yearlyInterest = 0;
          yearlyPrincipal = 0;
        }
      }
    }

    return {
      downPaymentAmount: validDownPaymentAmount,
      principalAmount,
      monthlyPayment,
      totalInterest,
      totalPayment,
      totalInstallments: n,
      principalRatio: principalAmount === 0 ? 0 : (principalAmount / (principalAmount + totalInterest)) * 100,
      schedule
    };

  }, [propertyValue, downPaymentAmount, loanTermYears, interestRate, showSchedule]);

  return (
    <div className="calculator-wrapper">
      <div className="calculator-container">

        <div className="calculator-header">
          <h1>Finance Options</h1>
          <p>Estimate your monthly payments, adjust terms, and find a financing plan that perfectly fits your budget with our comprehensive calculator.</p>
        </div>

        <div className="calculator-content">
          <div className="input-section">
            <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem' }}>Property Details</h3>

            <div className="input-group">
              <div className="input-label">
                <label>Property Value</label>
                <span>{formatCurrency(propertyValue)}</span>
              </div>
              <div className="number-input-wrapper">
                <span className="prefix">Rs</span>
                <input type="number" className="number-input" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} min="0" step="500000" />
              </div>
              <input type="range" className="range-slider" min="1000000" max="100000000" step="500000" value={propertyValue} onChange={e => setPropertyValue(Number(e.target.value))} />
            </div>

            <div className="input-group" style={{ marginBottom: '40px' }}>
              <div className="input-label">
                <label>Down Payment</label>
              </div>
              <div className="number-input-wrapper">
                <span className="prefix">Rs</span>
                <input type="number" className="number-input" value={downPaymentAmount} onChange={e => setDownPaymentAmount(Number(e.target.value))} min="0" max={propertyValue} step="50000" />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '8px' }}>
                {((calculations.downPaymentAmount / propertyValue) * 100 || 0).toFixed(1)}% of property value
              </div>
            </div>

            <div style={{ height: '1px', background: '#e2e8f0', margin: '30px 0' }}></div>

            <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: '1.2rem' }}>Installment Details</h3>

            <div className="input-group">
              <div className="input-label">
                <label>Installment Duration</label>
                <span>{loanTermYears} Years</span>
              </div>
              <input type="range" className="range-slider" min="1" max="5" step="1" value={loanTermYears} onChange={(e) => setLoanTermYears(Number(e.target.value))} />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <div className="input-label">
                <label>Interest rate</label>
                <span>{interestRate.toFixed(1)}%</span>
              </div>
              <input type="range" className="range-slider" min="0" max="25" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} />
            </div>
          </div>

          <div className="results-section">
            <div className="monthly-result">
              <h3>Installment Per Month</h3>
              <div className="amount">{formatCurrency(calculations.monthlyPayment)}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Installments: <strong style={{ color: 'white' }}>{calculations.totalInstallments} Months</strong>
              </div>
            </div>

            <div className="progress-bar-container">
              <div className="progress-principal" style={{ width: `${calculations.principalRatio}%` }}></div>
            </div>

            <div className="result-breakdown">
              <div className="breakdown-item">
                <div className="breakdown-label"><div className="dot principal"></div>Principal Amount</div>
                <div className="breakdown-value">{formatCurrency(calculations.principalAmount)}</div>
              </div>
              <div className="breakdown-item">
                <div className="breakdown-label"><div className="dot interest"></div>Total Interest</div>
                <div className="breakdown-value">{formatCurrency(calculations.totalInterest)}</div>
              </div>
              <div className="breakdown-item total-payment">
                <div className="breakdown-label">Total Payment</div>
                <div className="breakdown-value">{formatCurrency(calculations.totalPayment)}</div>
              </div>
            </div>

            <div className="schedule-toggle">
              <button onClick={() => setShowSchedule(!showSchedule)}>
                {showSchedule ? 'Hide Amortization Schedule' : 'View Amortization Schedule'}
              </button>
            </div>
          </div>
        </div>

        {showSchedule && (
          <div className="schedule-table-container">
            <h3>Annual Repayment Schedule</h3>
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {calculations.schedule.map((row) => (
                  <tr key={row.year}>
                    <td>Year {row.year}</td>
                    <td>{formatCurrency(row.payment)}</td>
                    <td>{formatCurrency(row.principal)}</td>
                    <td>{formatCurrency(row.interest)}</td>
                    <td>{formatCurrency(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

export default InstallmentCalculator;
