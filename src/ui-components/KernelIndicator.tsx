import { Widget } from '@lumino/widgets';
import { INotebookTracker } from '@jupyterlab/notebook';

export class KernelIndicator extends Widget {
  private tracker: INotebookTracker;

  constructor(tracker: INotebookTracker) {
    super();
    this.tracker = tracker;

    this.addClass('ck-KernelIndicator');

    tracker.currentChanged.connect(() => {
      this.connectSignals();
      this.update();
    });

    this.connectSignals();
    this.update();
  }

  private connectSignals(): void {
    const panel = this.tracker.currentWidget;
    if (!panel) return;

    panel.sessionContext.statusChanged.connect(() => {
      this.update();
    });

    panel.sessionContext.kernelChanged.connect(() => {
      this.update();
    });
  }

  private update(): void {
    const panel = this.tracker.currentWidget;

    if (!panel) {
      this.node.textContent = '';
      return;
    }

    const kernelName =
      panel.sessionContext.session?.kernel?.name ?? '';

    const status = panel.sessionContext.kernelDisplayStatus;

    let label = 'Python';

    if (kernelName === 'xr' || kernelName === 'ir') {
      label = 'R';
    }

    this.node.textContent = label;

    this.node.classList.remove(
      'ck-kernel-starting',
      'ck-kernel-ready'
    );

    if (status === 'idle') {
      this.node.classList.add('ck-kernel-ready');
    } else {
      this.node.classList.add('ck-kernel-starting');
    }
  }
}