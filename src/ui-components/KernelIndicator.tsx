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

    const kernelName =
      panel.sessionContext.session?.kernel?.name ?? '';

    let label = 'Unknown';

    if (kernelName.includes('r') || kernelName.includes('ir')) {
      label = 'R';
    } else if (kernelName.includes('python')) {
      label = 'Python';
    }

    this.node.textContent = label;
  }
}