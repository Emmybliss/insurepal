export function SuccessScreen({ result, onClose }: { result: any; onClose: () => void }) {
    return (
        <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>

            <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>

            <p className="text-gray-600">
                Your policy is being generated. <br />
                Please check your email for the policy document and receipt.
            </p>

            <div className="rounded bg-gray-100 p-3 text-sm text-gray-500">Transaction Ref: {result.reference}</div>

            <button onClick={onClose} className="mt-6 rounded-full bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
                Done
            </button>
        </div>
    );
}
