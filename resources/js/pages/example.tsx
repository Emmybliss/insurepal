import { AuthExample } from '@/components/auth/auth-example';
import { I18nExamples } from '@/components/examples/I18nExamples';

const example = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-red-500">Authentication Example</h1>
            <AuthExample />
            <h1 className="text-3xl font-bold text-red-500">Internationaliztion example</h1>
            <I18nExamples />
        </div>
    );
};

export default example;
