'use client'

import { Switch } from 'antd'
import { useEffect } from 'react'
import { BsMoonStarsFill } from 'react-icons/bs'
import { FaSun } from 'react-icons/fa6'

import { darkModeState } from '@/lib/state/darkMode'
import { getTheme, setTheme } from '@/server-actions/theme'

const DarkModeButton = () => {
  const { data: isDarkMode, setData: setDarkMode } = darkModeState()

  const toggleTheme = async () => {
    const newTheme = !isDarkMode
    await setTheme(newTheme ? 'dark' : 'light')
    setDarkMode(newTheme)
  }

  const switchChange = (checked: boolean) => {
    setDarkMode(checked)
    toggleTheme()
  }

  useEffect(() => {
    getTheme().then((theme) => {
      if (!theme) {
        // No theme set in cookies, check system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        setDarkMode(mediaQuery.matches)
        setTheme(mediaQuery.matches ? 'dark' : 'light')

        // Listen for system theme changes
        const listener = (e: MediaQueryListEvent) => {
          setDarkMode(e.matches)
          setTheme(e.matches ? 'dark' : 'light')
        }
        mediaQuery.addEventListener('change', listener)
        return () => {
          mediaQuery.removeEventListener('change', listener)
        }
      } else {
        setDarkMode(theme === 'dark')
      }
    })
  }, [])

  return (
    <Switch
      checkedChildren={<BsMoonStarsFill className="text-base mt-[3px]" />}
      unCheckedChildren={<FaSun className="text-base text-white" />}
      value={isDarkMode ?? false}
      onChange={switchChange}
    />
  )
}

export default DarkModeButton
