import { Widget } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';

export class KernelIndicator extends Widget {
  private tracker: INotebookTracker;

  constructor(tracker: INotebookTracker) {
    super();
    this.tracker = tracker;
    this.addClass('ck-KernelIndicator');

    this.updateLabel();

    tracker.currentChanged.connect(() => {
      this.updateLabel();
      this.connectSignals();
    });

    this.connectSignals();
  }

  private connectSignals(): void {
    const panel = this.tracker.currentWidget;
    if (!panel) {
      return;
    }

    panel.sessionContext.kernelChanged.connect(() => {
      this.updateLabel();
    });

    panel.sessionContext.statusChanged.connect(() => {
      this.updateLabel();
    });
  }

  private updateLabel(): void {
    const panel = this.tracker.currentWidget;

    if (!panel) {
      this.node.textContent = '';
      return;
    }

    const kernelName = panel.sessionContext.session?.kernel?.name ?? '';
    const lower = kernelName.toLowerCase();

    let label = '—';

    if (lower.includes('python')) {
      label = 'Py';
    } else if (lower === 'xr' || lower === 'ir' || lower.includes('r')) {
      label = 'R';
    } else if (kernelName) {
      label = kernelName;
    }

    this.node.textContent = label;
  }
}