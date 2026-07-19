'use client'

import {
  ArrowRight,
  Building2,
  FileText,
  FolderKanban,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

type NavigationCommand = {
  label: string
  href: string
}

type SearchResult = {
  id: string
  type: 'client' | 'content' | 'campaign'
  label: string
  description: string
  href: string
}

type CommandItem = {
  id: string
  type: 'action' | 'navigation' | SearchResult['type']
  label: string
  description: string
  href: string
}

const resultIcons = {
  action: Plus,
  navigation: ArrowRight,
  client: Building2,
  content: FileText,
  campaign: FolderKanban,
}

export function CommandPalette({
  navigation,
  isAdmin,
  open,
  onOpenChange,
}: {
  navigation: NavigationCommand[]
  isAdmin: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
      if (event.key === 'Escape' && open) onOpenChange(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onOpenChange, open])

  useEffect(() => {
    onOpenChange(false)
  }, [pathname, onOpenChange])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
    }
  }, [open])

  useEffect(() => {
    if (!open || !isAdmin || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/hub/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        )
        if (!response.ok) throw new Error('Search failed')
        const payload = (await response.json()) as { results: SearchResult[] }
        setResults(payload.results)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isAdmin, open, query])

  const commands = useMemo<CommandItem[]>(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const staticCommands: CommandItem[] = [
      ...(isAdmin
        ? [
            {
              id: 'action-new-content',
              type: 'action' as const,
              label: 'Create new content',
              description: 'Start a new social media draft',
              href: '/hub/content?create=1',
            },
          ]
        : []),
      ...navigation.map((item) => ({
        id: `navigation-${item.href}`,
        type: 'navigation' as const,
        label: `Go to ${item.label}`,
        description: 'Navigation',
        href: item.href,
      })),
    ].filter((item) =>
      normalizedQuery
        ? `${item.label} ${item.description}`
            .toLowerCase()
            .includes(normalizedQuery)
        : true,
    )

    return [...staticCommands, ...results]
  }, [isAdmin, navigation, query, results])

  useEffect(() => {
    setActiveIndex(0)
  }, [commands.length, query])

  function runCommand(command: CommandItem) {
    onOpenChange(false)
    router.push(command.href)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, commands.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && commands[activeIndex]) {
      event.preventDefault()
      runCommand(commands[activeIndex])
    }
  }

  if (!open) return null

  return (
    <div
      className="commandPaletteBackdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false)
      }}
      role="presentation"
    >
      <section
        aria-label="Search and quick actions"
        aria-modal="true"
        className="commandPalette"
        role="dialog"
      >
        <div className="commandPaletteSearch">
          {loading ? (
            <LoaderCircle className="is-spinning" size={19} />
          ) : (
            <Search size={19} />
          )}
          <input
            aria-controls="command-palette-results"
            aria-label="Search Social Hub"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={
              isAdmin
                ? 'Search content, campaigns, clients…'
                : 'Search navigation…'
            }
            ref={inputRef}
            value={query}
          />
          <kbd>ESC</kbd>
        </div>
        <div className="commandPaletteResults" id="command-palette-results">
          {commands.length ? (
            commands.map((command, index) => {
              const Icon = resultIcons[command.type]
              return (
                <button
                  className={index === activeIndex ? 'is-active' : ''}
                  key={command.id}
                  onClick={() => runCommand(command)}
                  onMouseEnter={() => setActiveIndex(index)}
                  type="button"
                >
                  <span>
                    <Icon size={17} />
                  </span>
                  <span>
                    <strong>{command.label}</strong>
                    <small>{command.description}</small>
                  </span>
                  <ArrowRight size={15} />
                </button>
              )
            })
          ) : (
            <div className="commandPaletteEmpty">
              <Search size={20} />
              <strong>No matching results</strong>
              <span>Try a client, campaign or content title.</span>
            </div>
          )}
        </div>
        <footer>
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            Navigate
          </span>
          <span>
            <kbd>↵</kbd>
            Open
          </span>
        </footer>
      </section>
    </div>
  )
}
