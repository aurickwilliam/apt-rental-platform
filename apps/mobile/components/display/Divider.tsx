import { View } from 'react-native'

interface DividerProps {
  marginVertical?: number;
  thickness?: number;
}

export default function Divider({ marginVertical = 15, thickness = 2 }: DividerProps  ) {
  return (
    <View
      className='w-full rounded-full bg-grey-100'
      style={{ marginVertical, height: thickness }}
    />
  )
}