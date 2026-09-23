/**
 * Student shell chrome — immersive quiz player vs hub loading.
 * Immersive (hide global header/bottom nav) only while QuizRunner is mounted,
 * never merely because the pathname is `/quiz/*` (loading.tsx must keep chrome).
 */

export function shouldUseQuizImmersiveChrome(quizPlayerMounted: boolean): boolean {
  return quizPlayerMounted;
}
