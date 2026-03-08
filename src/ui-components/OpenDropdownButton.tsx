import { CommandRegistry } from '@lumino/commands';
import { Menu, Widget } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class OpenDropdownButton extends ToolbarButton {
  constructor(
    commands: CommandRegistry,
    openFromFile: () => void,
    openFromURL: () => void
  ) {
    super({
      label: 'Open',
      tooltip: 'Open notebook',
      onClick: () => {
        const menu = new Menu({ commands });

        menu.addItem({
          command: 'jupytereverywhere:open-from-file'
        });

        menu.addItem({
          command: 'jupytereverywhere:open-from-url'
        });

        const anchor = this.node.getBoundingClientRect();
        menu.open(anchor.left, anchor.bottom);

        const dispose = () => {
          menu.dispose();
        };
        menu.aboutToClose.connect(dispose);
      }
    });

    this.addClass('je-OpenDropdownButton');

    commands.addCommand('jupytereverywhere:open-from-file', {
      label: 'Open from file',
      execute: () => {
        openFromFile();
      }
    });

    commands.addCommand('jupytereverywhere:open-from-url', {
      label: 'Open from URL',
      execute: () => {
        openFromURL();
      }
    });
  }
}