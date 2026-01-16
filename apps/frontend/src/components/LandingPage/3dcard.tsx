import { CardBody, CardContainer, CardItem } from "../ui/3d-card"

export const AnimatedCard = () => {
    return (
        <div className="border-y border-neutral-800">
            <div className="h-170 mx-20 bg-neutral-800">
                <div className="flex flex-col items-center">
                    <CardContainer className="inter-var">
                        <CardBody className="">
                            <CardItem
                                translateZ="5"
                                rotateX={10}
                                rotateZ={-2}
                                className="w-full mt-4"
                            >
                                <img
                                    src="/Dashboard.png"
                                    className="h-150 w-full object-cover rounded-xl group-hover:shadow-xl"
                                    alt="Dashboard thumbnail"
                                />
                            </CardItem>
                        </CardBody>
                    </CardContainer>
                </div>
            </div>
        </div>
    )
}