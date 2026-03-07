import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { ILiteRouter } from '@jupyterlite/application';
import { INotebookTracker, INotebookWidgetFactory } from '@jupyterlab/notebook';
import { INotebookContent } from '@jupyterlab/nbformat';
import {
  Dialog,
  showDialog,
  ToolbarButton,
  IToolbarWidgetRegistry,
  ISessionContext
} from '@jupyterlab/apputils';
import { PageConfig } from '@jupyterlab/coreutils';
import { DownloadDropdownButton } from '../ui-components/DownloadDropdownButton';
import { Commands } from '../commands';
import { SharingService } from '../sharing-service';
import { VIEW_ONLY_NOTEBOOK_FACTORY, IViewOnlyNotebookTracker } from '../view-only';
import { KernelSwitcherDropdownButton } from '../ui-components/KernelSwitcherDropdownButton';
import { KERNEL_URL_TO_NAME, KERNEL_DISPLAY_NAMES } from '../kernels';
import { handleNotebookUpload, openNotebookContent } from '../upload';

/**
 * Maps the notebook content language to a kernel name. We currently
 * only support Python and R notebooks, so this function maps them
 * to 'python' and 'xr' respectively. If the language is not recognized,
 * it defaults to 'python' (Pyodide).
 */
function mapLanguageToKernel(content: INotebookContent): string {
  const rawLang =
    (content?.metadata?.kernelspec?.language as string | undefined)?.toLowerCase() ||
    (content?.metadata?.language_info?.name as string | undefined)?.toLowerCase() ||
    'python';

  if (rawLang === 'r') {
    return 'xr';
  }
  return 'python';
}

/**
 * Patch pyodide HTTP kernel
 */
async function patchPyodideHttp(sessionContext: ISessionContext): Promise<void> {
  const session = sessionContext.session;
  if (!session) {
    throw Error('Session should have been ready');
  }
  const kernel = session.kernel;
  if (!kernel) {
    console.warn('Kernel was expected but not found');
    return;
  }
  if (kernel.name !== 'python') {
    console.debug('Non-python kernel: not patching');
    return;
  }
  await kernel.requestExecute({
    allow_stdin: false,
    code: [
      '%pip install -y pyodide-http requests',
      'import pyodide_http',
      'pyodide_http.patch_all()'
    ].join('\n'),
    silent: true,
    stop_on_error: false,
    store_history: false
  });
}

export const notebookPlugin: JupyterFrontEndPlugin<void> = {
  id: 'jupytereverywhere:notebook',
  autoStart: true,
  requires: [
    INotebookTracker,
    IViewOnlyNotebookTracker,
    IToolbarWidgetRegistry,
    INotebookWidgetFactory
  ],
  optional: [ILiteRouter],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    readonlyTracker: IViewOnlyNotebookTracker,
    toolbarRegistry: IToolbarWidgetRegistry,
    router?: ILiteRouter | null
  ) => {
    const { commands, serviceManager } = app;
    const { contents } = serviceManager;

    const params = new URLSearchParams(window.location.search);

    // Are we landing on the Files tab directly? In this case, we won't
    // auto-create a new notebook or activate the notebook sidebar.
    const nowUrl = new URL(window.location.href);
    const onFilesPath = /\/lab\/files(?:\/|$)/.test(nowUrl.pathname);
    const onFilesTab = nowUrl.searchParams.get('tab') === 'files';
    const onFilesIntent = onFilesPath || onFilesTab;

    let notebookId = params.get('notebook');
    const uploadedNotebookId = params.get('uploaded-notebook');

    if (notebookId?.endsWith('.ipynb')) {
      notebookId = notebookId.slice(0, -6);
    }

    /**
     * Load a shared notebook from the CKHub API
     */
    const loadSharedNotebook = async (id: string): Promise<void> => {
      try {
        console.log(`Loading shared notebook with ID: ${id}`);

        const apiUrl =
          PageConfig.getOption('sharing_service_api_url') || 'http://localhost:8080/api/v1';
        const sharingService = new SharingService(apiUrl);

        console.log(`API URL: ${apiUrl}`);
        console.log('Retrieving notebook from API...');

        const notebookResponse = await sharingService.retrieve(id);
        console.log('API Response received:', notebookResponse);

        const { content }: { content: INotebookContent } = notebookResponse;

        if (content.cells) {
          content.cells.forEach(cell => {
            cell.metadata = {
              ...cell.metadata,
              editable: false
            };
          });
        }

        const { id: responseId, readable_id, domain_id } = notebookResponse;
        content.metadata = {
          ...content.metadata,
          isSharedNotebook: true,
          sharedId: responseId,
          readableId: readable_id,
          domainId: domain_id
        };

        const filename = `Shared_${readable_id || responseId}.ipynb`;

        await contents.save(filename, {
          content,
          format: 'json',
          type: 'notebook',
          writable: false
        });

        await commands.execute('docmanager:open', {
          path: filename,
          factory: VIEW_ONLY_NOTEBOOK_FACTORY
        });

        const url = new URL(window.location.href);
        url.searchParams.delete('kernel');
        window.history.replaceState({}, '', url.toString());

        console.log(`Successfully loaded shared notebook: ${filename}`);
      } catch (error) {
        console.error('Failed to load shared notebook:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to load shared notebook "${id}": ${errorMessage}`);
        await createNewNotebook();
      }
    };

    /**
     * Create a new blank notebook
     */
    const createNewNotebook = async (): Promise<void> => {
      try {
        const params = new URLSearchParams(window.location.search);
        const desiredKernelParam = params.get('kernel') || 'python';
        const desiredKernel = KERNEL_URL_TO_NAME[desiredKernelParam] || 'python';

        await commands.execute('notebook:create-new', {
          kernelName: desiredKernel
        });

        console.log(`Created new notebook with kernel: ${desiredKernel}`);
      } catch (error) {
        console.error('Failed to create new notebook:', error);
      }
    };

    const openUploadedNotebook = async (id: string): Promise<void> => {
      try {
        const raw = localStorage.getItem(`uploaded-notebook:${id}`);
        if (!raw) {
          console.warn(`No uploaded notebook found for ID: ${id}`);
          await createNewNotebook();
          return;
        }

        const content = JSON.parse(raw) as INotebookContent;

        const kernelName = mapLanguageToKernel(content);
        content.metadata.kernelspec = {
          name: kernelName,
          display_name: KERNEL_DISPLAY_NAMES[kernelName] ?? kernelName
        };

        const filename = `${(content.metadata?.name as string) || `Uploaded_${id}`}.ipynb`;

        await contents.save(filename, {
          type: 'notebook',
          format: 'json',
          content
        });
        await commands.execute('docmanager:open', { path: filename });

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('uploaded-notebook');
        window.history.replaceState({}, '', currentUrl.toString());

        localStorage.removeItem(`uploaded-notebook:${id}`);
        console.log(`Opened uploaded notebook: ${filename}`);
      } catch (error) {
        console.error('Failed to open uploaded notebook:', error);
        await createNewNotebook();
      }
    };

    /**
     * Open notebook from URL
     */
    const openNotebookFromURL = async (): Promise<void> => {
      const url = window.prompt('Enter the URL of a .ipynb notebook file:');
      if (!url) {
        return;
      }

      try {
        let fetchUrl = url.trim();

        if (fetchUrl.includes('github.com') && fetchUrl.includes('/blob/')) {
          fetchUrl = fetchUrl
            .replace('https://github.com/', 'https://raw.githubusercontent.com/')
            .replace('/blob/', '/');
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch notebook: ${response.status} ${response.statusText}`);
        }

        const parsed = (await response.json()) as INotebookContent;
        await openNotebookContent(parsed);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to open notebook from URL:', error);
        window.alert(`Failed to open notebook from URL:\n${message}`);
      }
    };

    if (notebookId) {
      void loadSharedNotebook(notebookId);
    } else if (uploadedNotebookId) {
      void openUploadedNotebook(uploadedNotebookId);
    } else if (!onFilesIntent) {
      void createNewNotebook();
    }

    tracker.widgetAdded.connect(async (_, panel) => {
      await panel.sessionContext.ready;

      const url = new URL(window.location.href);
      if (url.searchParams.has('kernel')) {
        url.searchParams.delete('kernel');
        window.history.replaceState({}, '', url.toString());
        console.log('Removed kernel param from URL after kernel init.');
      }

      panel.sessionContext.kernelChanged.connect(patchPyodideHttp);
      await patchPyodideHttp(panel.sessionContext);
    });

    for (const toolbarName of ['Notebook', 'ViewOnlyNotebook']) {
    toolbarRegistry.addFactory(
  toolbarName,
  'coursekataLogo',
  () =>
    new ToolbarButton({
      label: '',
      tooltip: 'CourseKata',
      onClick: () => {
        window.open('https://coursekata.org', '_blank');
      },
      className: 'ck-logo-button'
    })
);
      toolbarRegistry.addFactory(
        toolbarName,
        'createCopy',
        () =>
          new ToolbarButton({
            label: 'Create Copy',
            tooltip: 'Create an editable copy of this notebook',
            className: 'je-CreateCopyButton',
            onClick: () => {
              void commands.execute(Commands.createCopyNotebookCommand);
            }
          })
      );

      toolbarRegistry.addFactory(
        toolbarName,
        'upload',
        () =>
          new ToolbarButton({
            label: 'Open',
            tooltip: 'Open a notebook from a file or URL',
            onClick: async () => {
              const result = await showDialog({
                title: 'Open Notebook',
                body: 'Choose how you would like to open a notebook:',
                buttons: [
                  Dialog.cancelButton(),
                  Dialog.okButton({ label: 'Open from File' }),
                  Dialog.warnButton({ label: 'Open from URL' })
                ]
              });

              if (result.button.label === 'Open from File') {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.ipynb,application/json';
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) {
                    return;
                  }
                  await handleNotebookUpload(file);
                };
                input.click();
                return;
              }

              if (result.button.label === 'Open from URL') {
                await openNotebookFromURL();
              }
            }
          })
      );

      toolbarRegistry.addFactory(
        toolbarName,
        'downloadDropdown',
        () => new DownloadDropdownButton(commands)
      );

      toolbarRegistry.addFactory(
        'Notebook',
        'jeKernelSwitcher',
        () => new KernelSwitcherDropdownButton(commands, tracker)
      );
    }

    void app.restored.then(() => {
      const url = new URL(window.location.href);
      if (/\/lab\/$/.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/lab\/$/, '/lab/index.html');
        window.history.replaceState({}, '', url.toString());
      }

      const after = new URL(window.location.href);
      if (after.searchParams.get('tab') === 'notebook') {
        const id = document.querySelector('.jp-NotebookPanel')?.id;
        if (id) {
          app.shell.activateById(id);
          after.searchParams.delete('tab');
          const base = (router?.base || '').replace(/\/$/, '');
          const canonical = new URL(`${base}/lab/index.html`, window.location.origin);
          canonical.hash = after.hash;
          if (
            after.pathname + after.search + after.hash !==
            canonical.pathname + canonical.search + canonical.hash
          ) {
            window.history.replaceState(null, 'Notebook', canonical.toString());
          }
        }
      }
    });
  }
};