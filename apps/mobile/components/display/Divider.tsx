import { View } from 'react-native'

interface DividerProps {
  marginVertical?: number;
}

export default function Divider({ marginVertical = 15 }: DividerProps  ) {
  return (
    <View
      className='w-full h-[2px] rounded-full bg-grey-100'
      style={{ marginVertical }}
    />
  )
}