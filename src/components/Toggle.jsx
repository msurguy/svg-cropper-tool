import { useMemo } from 'react';

const getGuid = () => {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return S4() + S4();
};

export default function Toggle({ label, value, onChange }) {
  const guid = useMemo(() => getGuid(), []);

  const handleChange = (e) => {
    onChange(e.target.checked);
  };

  return (
    <div className="sidebar-control">
      <div className="control-header">
        <div className="custom-control custom-switch">
          <input
            type="checkbox"
            className="custom-control-input"
            id={guid}
            value={value}
            checked={!!value}
            onChange={handleChange}
          />
          <label className="custom-control-label" htmlFor={guid}>
            {label}
          </label>
        </div>
      </div>
    </div>
  );
}
