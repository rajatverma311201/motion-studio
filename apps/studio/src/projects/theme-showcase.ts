import {makeProject} from '@motion-canvas/core';
import {resolveProjectName, type ChaptersFile} from '@motion-studio/video-kit';

import chapters from '../scenes/theme-showcase/chapters.json';
import scene from '../scenes/theme-showcase/scene?scene';

const lesson = chapters as ChaptersFile;

export default makeProject({name: resolveProjectName(lesson.slug, lesson), scenes: [scene]});
