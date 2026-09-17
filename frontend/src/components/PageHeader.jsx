// Every page used to open with a mono all-caps "eyebrow" label (a
// numbered "Waypoint NN" in most cases) above an h1. That's exactly the
// template chrome this redesign removes — headings here just say what
// the page is, in one clear line, with an optional action on the right
// for the page's single primary task.
export default function PageHeader({ title, description, action }) {
  return (
    <div className="page-header">
      <div className="row-between">
        <div>
          <h1>{title}</h1>
          {description && <p className="page-header-desc">{description}</p>}
        </div>
        {action && <div className="page-header-action">{action}</div>}
      </div>
    </div>
  );
}
