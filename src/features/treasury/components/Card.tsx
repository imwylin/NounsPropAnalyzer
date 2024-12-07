interface CardProps {
  title: string;
  value: string;
  subValue?: string;
}

export function Card({ title, value, subValue }: CardProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
        {value}
      </p>
      {subValue && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subValue}
        </p>
      )}
    </div>
  );
} 