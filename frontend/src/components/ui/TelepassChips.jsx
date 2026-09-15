export default function TelepassChips({telepassNumero = ""}) {
    return (
        <span className="bg-bg-secondary inline-flex items-center gap-2 min-w-0 px-2 rounded-md select-none h-8">
            <img src="telepass.jpg" alt="" width={20} title={telepassNumero}/>
        </span>
    );
}