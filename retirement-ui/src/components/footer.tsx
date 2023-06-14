import {FC} from "react";

export const Footer: FC = () => (
    <footer className="footer shrink-0 b-0 h-4 w-full">
        <div className="content has-text-centered">
            <p>
                <strong>Carbon Retirement</strong> by{' '}
                <a href="https://www.sunrisestake.com">Sunrise Stake</a>. The source code is licensed{' '}
                <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
            </p>
        </div>
        <div className="content has-text-centered justify-self-end">
            <p>
                In conjunction with{' '}
                <img src="/toucan.png" alt="Toucan" className="inline-block h-4 ml-2"/>
            </p>
        </div>
    </footer>
);