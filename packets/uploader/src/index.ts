export interface ExtUploaderOptions {
  target: string | HTMLElement;
  endpoint: string;
  maxFileSizeMB?: number;
  allowedTypes?: string[];
  chunked?: boolean;
  onSuccess?: (response: any) => void;
  onError?: (err: Error) => void;
}

export class ExtUploader {
  private container: HTMLElement;
  private options: ExtUploaderOptions;
  private dropZone!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private progressBar!: HTMLElement;
  private statusText!: HTMLElement;

  constructor(options: ExtUploaderOptions) {
    this.options = options;
    this.container = typeof options.target === 'string' ? document.querySelector(options.target)! : options.target;

    this.render();
  }

  private render(): void {
    this.container.classList.add('ext-uploader-root');
    this.container.innerHTML = `
      <style>
        .ext-uploader-root {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 500px;
          width: 100%;
        }
        .ext-uploader-dropzone {
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 36px 20px;
          text-align: center;
          background: rgba(18, 22, 31, 0.7);
          backdrop-filter: blur(16px);
          color: #f1f5f9;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .ext-uploader-dropzone.hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
        }
        .ext-uploader-icon { font-size: 2.5rem; margin-bottom: 8px; }
        .ext-uploader-progress-bg {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-top: 16px;
          overflow: hidden;
          display: none;
        }
        .ext-uploader-progress-bar {
          width: 0%;
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #06b6d4);
          transition: width 0.2s ease;
        }
        .ext-uploader-status { font-size: 0.85rem; color: #94a3b8; margin-top: 8px; }
      </style>

      <div class="ext-uploader-dropzone" id="dropzone">
        <div class="ext-uploader-icon">📁</div>
        <div style="font-weight: 700;">Drag & Drop files here or click to browse</div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Supports large files & chunked uploads</div>
        <input type="file" id="fileInput" style="display: none;" />
        <div class="ext-uploader-progress-bg" id="progressBg">
          <div class="ext-uploader-progress-bar" id="progressBar"></div>
        </div>
        <div class="ext-uploader-status" id="statusText"></div>
      </div>
    `;

    this.dropZone = this.container.querySelector('#dropzone')!;
    this.fileInput = this.container.querySelector('#fileInput') as HTMLInputElement;
    this.progressBar = this.container.querySelector('#progressBar')!;
    this.statusText = this.container.querySelector('#statusText')!;

    this.bindEvents();
  }

  private bindEvents(): void {
    this.dropZone.addEventListener('click', () => this.fileInput.click());

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('hover');
    });

    this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('hover'));

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('hover');
      if (e.dataTransfer?.files.length) {
        this.uploadFile(e.dataTransfer.files[0]);
      }
    });

    this.fileInput.addEventListener('change', () => {
      if (this.fileInput.files?.length) {
        this.uploadFile(this.fileInput.files[0]);
      }
    });
  }

  public uploadFile(file: File): void {
    const progressBg = this.container.querySelector('#progressBg') as HTMLElement;
    progressBg.style.display = 'block';
    this.statusText.textContent = `Uploading ${file.name}...`;

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', this.options.endpoint, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        this.progressBar.style.width = `${percent}%`;
        this.statusText.textContent = `Uploading ${file.name} (${Math.round(percent)}%)`;
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        this.statusText.textContent = `✓ Upload complete: ${file.name}`;
        if (this.options.onSuccess) this.options.onSuccess(xhr.responseText);
      } else {
        this.statusText.textContent = `❌ Upload failed`;
        if (this.options.onError) this.options.onError(new Error('Upload failed'));
      }
    };

    xhr.send(formData);
  }
}
