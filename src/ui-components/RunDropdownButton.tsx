import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class RunDropdownButton extends ToolbarButton {
  constructor(commands: CommandRegistry) {
    super({
      label: 'Run',
      tooltip: 'Run notebook cells',
      onClick: () => {
        const menu = new Menu({ commands });

        menu.addItem({
          command: 'notebook:run-all-cells'
        });

        menu.addItem({
          command: 'jupytereverywhere:run-all-above'
        });

        const anchor = this.node.getBoundingClientRect();
        menu.open(anchor.left, anchor.bottom);

        const dispose = () => {
          menu.dispose();
        };
        menu.aboutToClose.connect(dispose);
      }
    });

    this.addClass('je-RunDropdownButton');

    commands.addCommand('jupytereverywhere:run-all-above', {
      label: 'Run all above',
      execute: async () => {
        await commands.execute('notebook:run-all-above');
      }
    });
  }
}