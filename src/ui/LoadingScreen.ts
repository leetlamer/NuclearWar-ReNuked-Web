export class LoadingScreen {
  private failed = false;
  private progress =
    document.querySelector<HTMLProgressElement>("#load-progress")!;
  private status = document.querySelector<HTMLElement>("#load-status")!;
  private percent = document.querySelector<HTMLElement>("#load-percent")!;
  readonly start = document.querySelector<HTMLButtonElement>("#start")!;
  update(value: number, status: string) {
    if (this.failed) return;
    this.progress.value = Math.max(this.progress.value, Math.min(100, value));
    this.percent.textContent = `${Math.floor(this.progress.value)}%`;
    this.status.textContent = status;
  }
  ready() {
    this.update(100, "Ready to Play — Click Start Game");
    this.start.disabled = false;
  }
  fail(error: unknown) {
    this.failed = true;
    this.start.disabled = true;
    this.status.textContent = `Unable to load the game: ${String(error)}`;
    document.querySelector<HTMLButtonElement>("#retry")!.hidden = false;
    document.querySelector<HTMLButtonElement>("#retry")!.onclick = () =>
      location.reload();
  }
}
