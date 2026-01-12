import {
  IconHome,
  IconHomeFilled,
  IconSearch,
  IconBed,
  IconBedFilled,
  IconMessageCircle,
  IconMessageCircleFilled,
  IconUser,
  IconUserFilled,
  IconChartDonut,
  IconChartDonutFilled,
  IconBuilding
} from '@tabler/icons-react-native'
import { JSX } from "react";


type IconProps = {
  color?: string
  size?: number
  isFocused?: boolean
}

export const TENANTICONS: Record<string, (props: IconProps) => JSX.Element> = {
  home: (props) => (
    props.isFocused
      ? <IconHomeFilled size={props.size} color={props.color} />
      : <IconHome size={props.size} color={props.color} />
  ),

  search: (props) => (
    props.isFocused
      ? <IconSearch size={props.size} color={props.color} strokeWidth={2.5} />
      : <IconSearch size={props.size} color={props.color} />
  ),
  rentals: (props) => (
    props.isFocused
      ? <IconBedFilled size={props.size} color={props.color} />
      : <IconBed size={props.size} color={props.color} />
  ),
  chat: (props) => (
    props.isFocused
      ? <IconMessageCircleFilled size={props.size} color={props.color} />
      : <IconMessageCircle size={props.size} color={props.color} />
  ),
  profile: (props) => (
    props.isFocused
      ? <IconUserFilled size={props.size} color={props.color} />
      : <IconUser size={props.size} color={props.color} />
  ),
}

export const LANDLORDICONS: Record<string, (props: IconProps) => JSX.Element> = {
  dashboard: (props) => (
    props.isFocused
      ? <IconChartDonutFilled size={props.size} color={props.color} />
      : <IconChartDonut size={props.size} color={props.color} />
  ),
  units: (props) => (
    props.isFocused
      ? <IconBuilding size={props.size} color={props.color} strokeWidth={2.5} />
      : <IconBuilding size={props.size} color={props.color} strokeWidth={2.5} />
  ),
  chat: (props) => (
    props.isFocused
      ? <IconMessageCircleFilled size={props.size} color={props.color} />
      : <IconMessageCircle size={props.size} color={props.color} />
  ),
  profile: (props) => (
    props.isFocused
      ? <IconUserFilled size={props.size} color={props.color} />
      : <IconUser size={props.size} color={props.color} />
  ),
}
