import {FC} from "react";
import {useAppStore} from "@/app/providers";

export const Footer: FC = () => {
    const [adminMode, setAdminMode] = useAppStore(state => [state.adminMode, state.setAdminMode]);
    return (
        <footer className="footer shrink-0 b-0 h-4 w-full">
            <div className="content has-text-centered">
                <p>
                    <strong>Carbon Retirement</strong> by{' '}
                    <a href="https://www.sunrisestake.com">Sunrise Stake</a>. The source code is licensed{' '}
                    <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
                </p>
            </div>
            <div className="content has-text-centered">
                <p>
                    In conjunction with{' '}
                    <img src="/toucan.png" alt="Toucan" className="inline-block h-4 ml-2"/>
                </p>
            </div>
            <div className="tooltip mt-0.5 justify-self-end"
                 data-tip="Admin mode lets Sunrise Stake admins retire funds from the Sunrise Stake platform.">
                <div className="form-toggle flex items-center space-x-2">
                    <input type="checkbox" className="toggle toggle-xs" onChange={(e) => setAdminMode(e.target.checked)} defaultChecked={adminMode}/>
                    <label htmlFor="toggle" className="text-xs">Admin</label>
                </div>
            </div>
        </footer>
    );
};