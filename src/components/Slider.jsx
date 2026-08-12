export default function Slider({
  disabled = false,
  min = 0,
  max = 100,
  step = 1,
  label = 'Label',
  value = 50,
  onChange,
}) {
  const handleInput = (e) => {
    const newValue = parseFloat(e.target.value);
    if (newValue > min) {
      onChange(newValue);
    } else {
      onChange(min);
    }
  };

  const handleChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="sidebar-control">
      <div className="control-header">
        <div></div>
        <div className="control-label">
          <div className="control-output">
            <input
              disabled={disabled}
              type="text"
              value={value}
              onChange={handleChange}
            />
          </div>
          {label}
        </div>
        <div></div>
      </div>
      <input
        disabled={disabled}
        className="custom-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={handleInput}
      />
    </div>
  );
}
