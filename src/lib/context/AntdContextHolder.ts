'use client'

import { MessageInstance } from 'antd/es/message/interface'
import { HookAPI } from 'antd/es/modal/useModal'
import { NotificationInstance } from 'antd/es/notification/interface'
import { createContext, useContext } from 'react'

type AntdContextHolderType = {
  antdMessage: MessageInstance | null
  antdModal: HookAPI | null
  antdNotification: NotificationInstance | null
}

export const AntdContextHolder = createContext<AntdContextHolderType>({
  antdMessage: null,
  antdModal: null,
  antdNotification: null,
})

export const useAntdContextHolder = () => useContext(AntdContextHolder)
