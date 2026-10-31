import type {ReactElement} from 'react';
import themesData from '@/generated/themes.json';

interface ThemeEntry {
  id: string;
  name: string;
  defaultMode: string;
}

const data = themesData as {defaultThemeId: string; themes: ThemeEntry[]};

/** Every registered theme, generated from the theme files by `pnpm sync:themes`. */
export function ThemeTable(): ReactElement {
  return (
    <table>
      <thead>
        <tr>
          <th>Id</th>
          <th>Name</th>
          <th>Default mode</th>
        </tr>
      </thead>
      <tbody>
        {data.themes.map(theme => (
          <tr key={theme.id}>
            <td>
              <code>{theme.id}</code>
              {theme.id === data.defaultThemeId ? ' (default)' : ''}
            </td>
            <td>{theme.name}</td>
            <td>{theme.defaultMode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
