export function DecisionLog({ entries }: { entries: any[] }) {
  return (
    <div>
      <h3>Agent decision log</h3>
      <ul>
        {(entries ?? []).map((e: any, i: number) => (
          <li key={i}>
            <b>[{e.agent}]</b> {e.action} — <i>{e.rationale}</i>
          </li>
        ))}
      </ul>
    </div>
  );
}
