import type { Command } from '../types/interface'
import process from 'process'

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export async function fetchCommandsByCourse(
  course: number,
  count: number = 20
): Promise<Command[]> {
  const data: Command[] = await fetch(
    `${API_BASE_URL}/commands/random?course=${course}&count=${count}`
  ).then(r => r.json())

  // Safety net: even if backend changes, keep only selected-level commands in UI.
  // Exclude id=1 (git init), id=2 (git clone), id=15 (git merge <branch>) from gameplay
  const EXCLUDED_IDS = new Set([1, 2, 15])
  return data.filter(cmd => cmd.course === course && !EXCLUDED_IDS.has(cmd.id))
}

export async function fetchCourse1Commands(): Promise<Command[]> {
  return fetchCommandsByCourse(1, 100)
}

export async function fetchCommandCatalogByCourse(course: number): Promise<Command[]> {
  const data: Command[] = await fetch(
    `${API_BASE_URL}/commands/course?course=${course}`
  ).then(r => r.json())

  return data
}
