import logo from '../assets/logo.png'

interface Props {
  height?: number
}

export function Logo({ height = 40 }: Props) {
  return <img className="logo" src={logo} alt="Foody Delivery" height={height} />
}
