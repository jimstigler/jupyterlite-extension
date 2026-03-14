import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class OpenDropdownButton extends ToolbarButton {
  constructor(
    commands: CommandRegistry,
    openFromFile: () => void,
    openFromURL: () => void,
    openNewRNotebook: () => void,
    openNewPythonNotebook: () => void
  ) {
    const commandOpenFile = 'jupytereverywhere:open-from-file';
    const commandOpenUrl = 'jupytereverywhere:open-from-url';
    const commandNewR = 'jupytereverywhere:new-r-notebook';
    const commandNewPython = 'jupytereverywhere:new-python-notebook';

    if (!commands.hasCommand(commandOpenFile)) {
      commands.addCommand(commandOpenFile, {
        label: 'Open from file',
        execute: () => {
          openFromFile();
        }
      });
    }

    if (!commands.hasCommand(commandOpenUrl)) {
      commands.addCommand(commandOpenUrl, {
        label: 'Open from URL',
        execute: () => {
          openFromURL();
        }
      });
    }

    if (!commands.hasCommand(commandNewR)) {
      commands.addCommand(commandNewR, {
        label: 'New R notebook',
        execute: () => {
          openNewRNotebook();
        }
      });
    }

    if (!commands.hasCommand(commandNewPython)) {
      commands.addCommand(commandNewPython, {
        label: 'New Python notebook',
        execute: () => {
          openNewPythonNotebook();
        }
      });
    }

    super({
      label: 'Open',
      tooltip: 'Open or create a notebook',
      onClick: () => {
        const menu = new Menu({ commands });

        menu.addItem({ command: commandOpenFile });
        menu.addItem({ command: commandOpenUrl });
        menu.addItem({ type: 'separator' });
        menu.addItem({ command: commandNewR });
        menu.addItem({ command: commandNewPython });

        const anchor = this.node.getBoundingClientRect();
        menu.open(anchor.left, anchor.bottom);

        menu.aboutToClose.connect(() => {
          menu.dispose();
        });
      }
    });

    this.addClass('je-OpenDropdownButton');
  }
}