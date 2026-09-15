export default function Title({ left, right, bottom = "", ...props }) {
    return (

        <div className="flex flex-col gap-2 sticky top-0 z-10 bg-bg-secondary rounded-md p-2 justify-center">
            <div className="flex items-center justify-between min-h-18 ">
                {left ? left : ""}
                {right ? right : ""}
            </div>
            {bottom ? bottom : ""}
        </div>
    );
}