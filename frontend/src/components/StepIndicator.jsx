import React from 'react';

export default function StepIndicator({ current }) {
  const steps = [
    { num: 1, label: '악보' },
    { num: 2, label: '참조 연주' },
    { num: 3, label: '본인 연주' },
  ];
  return (
    <div className="step-indicator">
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div
            className={`step-dot ${current > s.num ? 'done' : current === s.num ? 'active' : ''}`}
            aria-current={current === s.num ? 'step' : undefined}
          >
            {current > s.num ? '✓' : s.num}
          </div>
          {i < steps.length - 1 && <span className="step-line" />}
        </React.Fragment>
      ))}
    </div>
  );
}
