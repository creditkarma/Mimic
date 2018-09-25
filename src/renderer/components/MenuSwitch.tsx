import { Menu, Switch } from "antd";
import * as React from "react";
import { Link } from "react-router-dom";

interface IProps {
  enabled: boolean;
  url: string;
  name: string;
  onChange: (checked: boolean) => void;
}

const MenuSwitch: React.SFC<IProps> = ({ url, enabled, name, onChange }) =>
  <Menu.Item key={url}>
    <div style={{ position: "absolute", left: 30 }}>
      <Switch size="small" checked={enabled} onChange={onChange} />
      <Link to={url} className="menu-switch">
        <span>{name}</span>
      </Link>
    </div>
  </Menu.Item>;

export default MenuSwitch;
