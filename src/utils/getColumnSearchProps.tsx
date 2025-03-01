import { Button, Flex, Input, TableColumnType, theme } from 'antd'
import { ChangeEvent } from 'react'
import { IoSearch } from 'react-icons/io5'

type Props = {
  placeholder?: string
  initialValue?: string
  onSearch: (args?: string) => void
}

export const getColumnSearchProps = <T extends unknown>(props: Props): TableColumnType<T> => {
  const { placeholder = 'Search', initialValue = '', onSearch } = props
  const { token } = theme.useToken()
  const { colorPrimaryText } = token

  let isInitialRender = true

  return {
    filterDropdown: (dropdownProps) => {
      const { setSelectedKeys, selectedKeys, confirm, clearFilters } = dropdownProps
      const searchValue = (selectedKeys.length ? selectedKeys[0] : '') as string

      if (initialValue && !selectedKeys.length && isInitialRender) {
        setSelectedKeys([initialValue])
      }

      const handleSearch = () => {
        confirm()
        onSearch(searchValue)
      }

      const handleClear = () => {
        if (!clearFilters) return
        clearFilters({ confirm: true, closeDropdown: true })
        onSearch()
      }

      const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedKeys(e.target.value ? [e.target.value] : [])
        isInitialRender = false
      }

      return (
        <div
          className="p-2"
          onKeyDown={(e) => {
            e.stopPropagation()
          }}
        >
          <Input
            placeholder={placeholder}
            value={searchValue}
            className="block mb-2"
            onChange={handleInputChange}
            onPressEnter={handleSearch}
          />
          <Flex gap={4} align="center" justify="flex-end" className="mt-2">
            <Button size="small" onClick={handleClear}>
              Clear
            </Button>
            <Button type="primary" size="small" onClick={handleSearch}>
              Search
            </Button>
          </Flex>
        </div>
      )
    },
    filterIcon: (filtered: boolean) => {
      const isFiltered: boolean = filtered || !!initialValue
      return <IoSearch className="text-base" style={isFiltered ? { color: colorPrimaryText } : {}} />
    },
  }
}
