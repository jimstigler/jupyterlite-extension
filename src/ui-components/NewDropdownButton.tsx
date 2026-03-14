import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class NewDropdownButton extends ToolbarButton {
  constructor(
    commands: CommandRegistry,
    openNewRNotebook: () => void,
    openNewPythonNotebook: () => void
  ) {
    const commandR = 'jupytereverywhere:new-r-notebook';
    const commandPython = 'jupytereverywhere:new-python-notebook';

    if (!commands.hasCommand(commandR)) {
      commands.addCommand(commandR, {
        label: 'New R notebook',
        execute: () => {
          openNewRNotebook();
        }
      });
    }

    if (!commands.hasCommand(commandPython)) {
      commands.addCommand(commandPython, {
        label: 'New Python notebook',
        execute: () => {
          openNewPythonNotebook();
        }
      });
    }

    super({
      label: 'New',
      tooltip: 'Create a new notebook',
      onClick: () => {
        const menu = new Menu({ commands });

        menu.addItem({
          command: commandR
        });

        menu.addItem({
          command: commandPython
        });

        const anchor = this.node.getBoundingClientRect();
        menu.open(anchor.left, anchor.bottom);

        menu.aboutToClose.connect(() => {
          menu.dispose();
        });
      }
    });

    this.addClass('je-NewDropdownButton');
  }
}