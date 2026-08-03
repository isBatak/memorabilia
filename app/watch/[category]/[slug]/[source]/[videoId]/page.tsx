import {notFound} from 'next/navigation';
import {VideoPage} from '../../../../../../components/video-page';
import {categories,getAllVideoParams,getEntry,type Category} from '../../../../../../lib/archive';
export const dynamicParams=false;
export const generateStaticParams=getAllVideoParams;
export default async function Page({params}:{params:Promise<{category:string;slug:string;source:string;videoId:string}>}) { const {category,slug,source,videoId}=await params;if(!categories.includes(category as Category))notFound();const entry=getEntry(category as Category,slug);const video=entry?.videos?.find(v=>v.id===videoId&&v.source.type===source);if(!entry||!video)notFound();return <VideoPage entry={entry} video={video}/> }
