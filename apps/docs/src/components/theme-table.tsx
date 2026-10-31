import type {ReactElement} from 'react';
import {themesJson} from '@/lib/themes';

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
        {themesJson.themes.map(theme => (
          <tr key={theme.id}>
            <td>
              <code>{theme.id}</code>
              {theme.id === themesJson.defaultThemeId ? ' (default)' : ''}
            </td>
            <td>{theme.name}</td>
            <td>{theme.defaultMode}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
