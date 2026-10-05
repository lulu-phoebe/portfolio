import type { Group, Object3D } from 'three';

export interface JournalOptions {
  width: number;
  height: number;
  spineWidth: number;
  leatherColor: string;
  blankPageCount: number;
}

export interface JournalModel {
  root: Group;
  frontHinge: Group;
  pages: Group[];
  contentAnchors: Map<string, Object3D>;
  setOpenProgress(progress: number): void;
  setExplodeProgress(progress: number): void;
  update(time: number, delta: number): void;
  dispose(): void;
}
