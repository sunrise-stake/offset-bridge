import {FC} from "react";

export const Footer: FC = () => (
    <footer className="footer shrink-0 b-0 h-16 w-full pb-8">
        <div className="content has-text-centered">
            <p>
                <strong>Carbon Retirement</strong> by{' '}
                <a href="https://www.sunrisestake.com">Sunrise Stake</a>. The source code is licensed{' '}
                <a href="http://opensource.org/licenses/mit-license.php">MIT</a>.
            </p>
        </div>
    </footer>
);