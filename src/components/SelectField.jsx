export default function SelectField({ label, value, options = [], onChange }) {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="sidebar-control">
      <div className="control-header">
        <div></div>
        <div className="control-label">{label}</div>
        <div></div>
      </div>
      <div className="control-header">
        <select
          value={value}
          className="custom-select custom-select-sm custom-select-input"
          onChange={handleChange}
        >
          {options.map((item, index) => (
            <option key={index} value={item.value}>
              {item.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
