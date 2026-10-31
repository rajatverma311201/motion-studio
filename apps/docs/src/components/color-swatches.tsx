import type {ReactElement} from 'react';
import palette from '@/generated/palette.json';

export function ColorSwatches(): ReactElement {
  return (
    <div className="nb-swatches">
      {Object.entries(palette).map(([name, value]) => (
        <div className="nb-swatch" key={name}>
          <span className="nb-swatch-color" aria-hidden="true">
            <span className="nb-swatch-fill" style={{backgroundColor: value}} />
          </span>
          <span className="nb-swatch-name">{name}</span>
          <code className="nb-swatch-value">{value}</code>
        </div>
      ))}
    </div>
  );
}
