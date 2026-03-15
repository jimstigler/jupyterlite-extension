import { CommandRegistry } from '@lumino/commands';
import { Menu } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class OpenDropdownButton extends ToolbarButton {
  constructor(
    commands: CommandRegistry,
    openFromFile: () => void,
    openFromURL: () => void,
    openNewRNotebook: () => void,
    openNewPythonNotebook: () => void,
    downloadNotebook: () => void
  ) {
    const commandOpenFile = 'jupytereverywhere:file-open-from-file';
    const commandOpenUrl = 'jupytereverywhere:file-open-from-url';
    const commandNewR = 'jupytereverywhere:file-new-r-notebook';
    const commandNewPython = 'jupytereverywhere:file-new-python-notebook';
    const commandDownload = 'jupytereverywhere:file-download-notebook';

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

    if (!commands.hasCommand(commandDownload)) {
      commands.addCommand(commandDownload, {
        label: 'Download notebook',
        execute: () => {
          downloadNotebook();
        }
      });
    }

    super({
      label: 'File',
      tooltip: 'File actions',
      onClick: () => {
        const menu = new Menu({ commands });

		menu.addItem({ command: commandNewR });
		menu.addItem({ command: commandNewPython });
		menu.addItem({ type: 'separator' });
		menu.addItem({ command: commandOpenFile });
		menu.addItem({ command: commandOpenUrl });
		menu.addItem({ type: 'separator' });
		menu.addItem({ command: commandDownload });

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