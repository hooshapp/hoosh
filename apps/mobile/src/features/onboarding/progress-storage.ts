import AsyncStorage from '@react-native-async-storage/async-storage';

import { createOnboardingProgressRepository, type OnboardingProgressRepository } from './progress-repository';

const repositories = new Map<string, OnboardingProgressRepository>();

export function setupRepository(project: string) {
  let repository = repositories.get(project);
  if (!repository) {
    repository = createOnboardingProgressRepository(AsyncStorage, project);
    repositories.set(project, repository);
  }
  return repository;
}
