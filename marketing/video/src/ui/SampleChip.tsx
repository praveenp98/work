import React from "react";
import { SampleChip as BrandChip } from "../../../brand/components/SampleChip";
import { TYPE } from "../../../brand/tokens";
import { useAreas } from "../layout";

/** The brand's sample-account chip (marketing/brand/components), at the size the current format calls for. */
export const SampleChip: React.FC<{ style?: React.CSSProperties }> = ({ style }) => <BrandChip size={TYPE[useAreas().layout].chip} style={style} />;
