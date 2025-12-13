export default function ButtonGroup({ onLeftClick, onRightClick }) {
  return (
    <div className="sidebar-control">
      <div className="control-header nav-fill">
        <button
          className="nav-item btn rounded btn-sm btn-light mr-3"
          onClick={(e) => {
            e.preventDefault();
            onLeftClick();
          }}
        >
          Clear
        </button>
        <button
          className="nav-item btn rounded btn-sm btn-light"
          onClick={(e) => {
            e.preventDefault();
            onRightClick();
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}
