import { DAY_NAMES, shortDate } from '../lib/dates'

export default function Heatmap({ cols }) {
  return (
    <div className="heatmap" role="img" aria-label="Son 12 haftanın tamamlama ısı haritası">
      <div className="hm-days" aria-hidden="true">{DAY_NAMES.map((d, i) => <span key={d}>{i % 2 === 0 ? d : ''}</span>)}</div>
      <div className="hm-grid">
        {cols.map((col, ci) => (
          <div className="hm-col" key={ci}>
            {col.map((cell) => {
              const level = cell.future || cell.total === 0 ? 0 : cell.count === 0 ? 1 : Math.ceil((cell.count / cell.total) * 3) + 1
              return <span key={cell.date} className={`hm-cell l${level}${cell.future ? ' future' : ''}`} title={`${shortDate(cell.date)}: ${cell.count}/${cell.total}`} />
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
