interface ResultCardProps {
  title: string;
  value: string;
  valueColor?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  valueColor = "text-white",
}) => (
  <div className="bg-gray-700 p-6 rounded-lg text-center">
    <h3 className="text-gray-300 text-sm mb-2">{title}</h3>
    <p className={`${valueColor} text-2xl font-bold`}>{value}</p>
  </div>
);
